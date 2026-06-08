/**
 * MerchantDashboard.tsx
 * Dashboard del Merchant: productos, pedidos, analytics y pagos
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface MerchantDashboardProps {
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
}

type Tab = 'analytics' | 'products' | 'orders' | 'payouts';

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) } });

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ isAuthenticated, onBack, viewPadding }) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [tab, setTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', stock: '0' });
  const [toast, setToast] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadData = useCallback(async () => {
    if (!isAtLeast('merchant')) return;
    setLoading(true);
    try {
      if (tab === 'analytics' && hasPermission('merchant.analytics')) {
        const r = await apiFetch('/api/merchant/analytics');
        if (r.ok) setAnalytics(await r.json());
      } else if (tab === 'products' && hasPermission('merchant.products')) {
        const r = await apiFetch('/api/merchant/products');
        if (r.ok) setProducts(await r.json());
      } else if (tab === 'orders' && hasPermission('merchant.orders')) {
        const r = await apiFetch('/api/merchant/orders');
        if (r.ok) setOrders(await r.json());
      } else if (tab === 'payouts' && hasPermission('merchant.payouts')) {
        const r = await apiFetch('/api/merchant/payouts');
        if (r.ok) setPayouts(await r.json());
      }
    } catch {}
    setLoading(false);
  }, [tab, isAtLeast, hasPermission]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!isAtLeast('merchant')) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Merchant Dashboard</div>
        <div style={{ color: '#6b7280', textAlign: 'center', fontSize: 14, marginBottom: 24 }}>Solo disponible para cuentas Merchant verificadas.</div>
        <button onClick={onBack} style={{ padding: '12px 32px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Volver</button>
      </div>
    );
  }

  const createProduct = async () => {
    if (!productForm.name || !productForm.price) return showToast('Nombre y precio requeridos');
    const r = await apiFetch('/api/merchant/products', {
      method: 'POST',
      body: JSON.stringify({ ...productForm, price: parseFloat(productForm.price), stock: parseInt(productForm.stock) }),
    });
    if (r.ok) {
      showToast('✅ Producto creado');
      setShowProductForm(false);
      setProductForm({ name: '', description: '', price: '', category: '', stock: '0' });
      loadData();
    } else {
      const d = await r.json();
      showToast(`❌ ${d.message}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const r = await apiFetch(`/api/merchant/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.ok) { showToast(`✅ Pedido ${status}`); loadData(); }
  };

  const requestPayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt < 5000) return showToast('Mínimo 5,000 XAF');
    const r = await apiFetch('/api/merchant/payouts/request', { method: 'POST', body: JSON.stringify({ amount: amt }) });
    if (r.ok) { showToast('✅ Solicitud de pago enviada'); setPayoutAmount(''); loadData(); }
    else { const d = await r.json(); showToast(`❌ ${d.message}`); }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6',
    shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
  };
  const NEXT_STATUS: Record<string, string> = {
    pending: 'confirmed', confirmed: 'preparing', preparing: 'shipped', shipped: 'delivered',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f5f6f8', display: 'flex', flexDirection: 'column', zIndex: 2000 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', paddingTop: viewPadding.top, padding: `calc(${viewPadding.top} + 8px) 16px 12px`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            🏪 Merchant Dashboard
            {is_verified && <VerifiedBadge type="merchant" size={16} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Gestiona tu tienda</div>
        </div>
        <button onClick={loadData} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {[
          { id: 'analytics', label: '📊 Stats', perm: 'merchant.analytics' },
          { id: 'products',  label: '📦 Productos', perm: 'merchant.products' },
          { id: 'orders',    label: '🛒 Pedidos', perm: 'merchant.orders' },
          { id: 'payouts',   label: '💳 Pagos', perm: 'merchant.payouts' },
        ].filter(t => hasPermission(t.perm)).map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)} style={{
            flex: '0 0 auto', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#f59e0b' : '#6b7280',
            borderBottom: tab === t.id ? '2px solid #f59e0b' : '2px solid transparent', fontSize: 12, whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>Cargando...</div>}

        {/* ANALYTICS */}
        {!loading && tab === 'analytics' && analytics && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Productos activos', value: analytics.products_active, icon: '📦', color: '#f59e0b' },
                { label: 'Pedidos totales',  value: analytics.orders_total, icon: '🛒', color: '#3b82f6' },
                { label: 'Pendientes',        value: analytics.orders_pending, icon: '⏳', color: '#ef4444' },
                { label: 'Ingresos (XAF)',    value: analytics.revenue_total?.toLocaleString(), icon: '💰', color: '#10b981' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value ?? 0}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            {analytics.daily_stats?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#374151' }}>📈 Últimos 7 días</div>
                {analytics.daily_stats.map((d: any) => (
                  <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>{new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</span>
                    <span>{d.orders} pedidos</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{parseFloat(d.revenue).toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && tab === 'products' && (
          <div>
            <button onClick={() => setShowProductForm(true)} style={{ width: '100%', padding: '12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}>
              + Nuevo producto
            </button>
            {showProductForm && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Nuevo producto</div>
                {[
                  { key: 'name', placeholder: 'Nombre del producto *', type: 'text' },
                  { key: 'price', placeholder: 'Precio (XAF) *', type: 'number' },
                  { key: 'stock', placeholder: 'Stock disponible', type: 'number' },
                  { key: 'category', placeholder: 'Categoría', type: 'text' },
                ].map(f => (
                  <input key={f.key} type={f.type} placeholder={f.placeholder} value={(productForm as any)[f.key]}
                    onChange={e => setProductForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                ))}
                <textarea placeholder="Descripción (opcional)" value={productForm.description}
                  onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 10, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowProductForm(false)} style={{ flex: 1, padding: 10, background: '#f3f4f6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                  <button onClick={createProduct} style={{ flex: 2, padding: 10, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Crear producto</button>
                </div>
              </div>
            )}
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No hay productos todavía</div>
            ) : products.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{p.category || 'Sin categoría'} • Stock: {p.stock}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#f59e0b' }}>{parseFloat(p.price).toLocaleString()} XAF</div>
                  <div style={{ fontSize: 11, color: p.status === 'active' ? '#10b981' : '#ef4444' }}>{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS */}
        {!loading && tab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No hay pedidos todavía</div>
            ) : orders.map(o => (
              <div key={o.id} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{o.customer_name || 'Cliente'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{o.customer_phone}</div>
                  </div>
                  <div style={{ background: STATUS_COLORS[o.status] + '22', color: STATUS_COLORS[o.status], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {o.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{parseFloat(o.total_amount || 0).toLocaleString()} XAF</span>
                  {NEXT_STATUS[o.status] && (
                    <button onClick={() => updateOrderStatus(o.id, NEXT_STATUS[o.status])}
                      style={{ padding: '6px 12px', background: STATUS_COLORS[NEXT_STATUS[o.status]], color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      → {NEXT_STATUS[o.status]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAYOUTS */}
        {!loading && tab === 'payouts' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>💳 Solicitar pago</div>
              <input type="number" placeholder="Monto (mínimo 5,000 XAF)" value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <button onClick={requestPayout} style={{ width: '100%', padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                Solicitar pago
              </button>
            </div>
            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No hay solicitudes de pago</div>
            ) : payouts.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{parseFloat(p.amount).toLocaleString()} XAF</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</div>
                </div>
                <div style={{ background: STATUS_COLORS[p.status] + '22', color: STATUS_COLORS[p.status], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {p.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
